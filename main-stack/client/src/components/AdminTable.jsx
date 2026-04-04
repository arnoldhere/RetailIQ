import React from 'react'
import {
    Badge,
    Box,
    Button,
    Flex,
    HStack,
    Icon,
    Select,
    TableContainer,
    Text,
    Th,
    Tooltip,
} from '@chakra-ui/react'
import {
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
} from '@chakra-ui/icons'

export function AdminTableShell({
    children,
    maxH = '62vh',
    borderColor = 'var(--border-light)',
    bg = 'var(--surface-card)',
}) {
    return (
        <Box
            borderRadius="2xl"
            overflow="hidden"
            border="1px solid"
            borderColor={borderColor}
            bg={bg}
            boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)"
        >
            <TableContainer
                maxH={maxH}
                overflowY="auto"
                overflowX="auto"
                sx={{
                    '&::-webkit-scrollbar': {
                        width: '10px',
                        height: '10px',
                    },
                    '&::-webkit-scrollbar-track': {
                        bg: 'rgba(148, 163, 184, 0.08)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        bg: 'rgba(59, 130, 246, 0.28)',
                        borderRadius: '999px',
                    },
                }}
            >
                {children}
            </TableContainer>
        </Box>
    )
}

export function SortableTh({
    label,
    sortKey,
    sortBy,
    sortOrder = 'asc',
    onSort,
    isNumeric = false,
    textAlign,
    minW,
    display,
    ...rest
}) {
    const isActive = sortBy === sortKey
    const nextOrder = isActive && sortOrder === 'asc' ? 'desc' : 'asc'
    const alignment = textAlign || (isNumeric ? 'right' : 'left')
    const ariaLabel = `${label}: sort ${nextOrder === 'asc' ? 'ascending' : 'descending'}`

    return (
        <Th
            py={4}
            px={4}
            minW={minW}
            display={display}
            textAlign={alignment}
            borderBottom="1px solid"
            borderColor="rgba(148, 163, 184, 0.22)"
            {...rest}
        >
            <Tooltip label={ariaLabel} hasArrow placement="top">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSort(sortKey)}
                    rightIcon={
                        isActive ? (
                            sortOrder === 'asc' ? <ChevronUpIcon boxSize={4} /> : <ChevronDownIcon boxSize={4} />
                        ) : (
                            <Icon as={ChevronUpIcon} boxSize={4} opacity={0.45} />
                        )
                    }
                    px={0}
                    minH="auto"
                    h="auto"
                    fontSize="xs"
                    fontWeight="800"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    color={isActive ? 'var(--primary-color)' : 'var(--text-secondary)'}
                    _hover={{ bg: 'transparent', color: 'var(--primary-color)' }}
                    _active={{ bg: 'transparent' }}
                    justifyContent={alignment === 'right' ? 'flex-end' : alignment === 'center' ? 'center' : 'flex-start'}
                    width="100%"
                    whiteSpace="nowrap"
                >
                    {label}
                </Button>
            </Tooltip>
        </Th>
    )
}

export function AdminTablePagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageSizeChange,
    onPrevious,
    onNext,
    itemLabel = 'rows',
    pageSizeOptions = [5, 10, 20, 50],
}) {
    const safeTotal = Number(totalItems || 0)
    const safePageSize = Number(pageSize || pageSizeOptions[0] || 10)
    const start = safeTotal === 0 ? 0 : (currentPage - 1) * safePageSize + 1
    const end = safeTotal === 0 ? 0 : Math.min(currentPage * safePageSize, safeTotal)

    return (
        <Flex
            mt={5}
            px={{ base: 1, md: 2 }}
            py={2}
            gap={3}
            align={{ base: 'stretch', md: 'center' }}
            justify="space-between"
            direction={{ base: 'column', md: 'row' }}
        >
            <HStack spacing={3} flexWrap="wrap">
                <Badge
                    colorScheme="blue"
                    variant="subtle"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="xs"
                >
                    Showing {start}-{end} of {safeTotal} {itemLabel}
                </Badge>
                <Text fontSize="sm" color="var(--text-secondary)">
                    Page {currentPage} of {Math.max(totalPages, 1)}
                </Text>
            </HStack>

            <Flex
                gap={3}
                align={{ base: 'stretch', md: 'center' }}
                direction={{ base: 'column', md: 'row' }}
            >
                {typeof onPageSizeChange === 'function' && (
                    <HStack spacing={2}>
                        <Text fontSize="sm" color="var(--text-secondary)">
                            Rows per page
                        </Text>
                        <Select
                            size="sm"
                            w="92px"
                            value={safePageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            borderRadius="full"
                            bg="white"
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </Select>
                    </HStack>
                )}

                <HStack spacing={2}>
                    <Button
                        size="sm"
                        variant="outline"
                        borderRadius="full"
                        leftIcon={<ChevronLeftIcon />}
                        onClick={onPrevious}
                        isDisabled={currentPage <= 1}
                    >
                        Previous
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        borderRadius="full"
                        rightIcon={<ChevronRightIcon />}
                        onClick={onNext}
                        isDisabled={currentPage >= totalPages}
                    >
                        Next
                    </Button>
                </HStack>
            </Flex>
        </Flex>
    )
}
